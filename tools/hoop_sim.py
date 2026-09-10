#!/usr/bin/env python3
"""
hoop_sim.py - Fake Arduino for the Arcade Hoop Projector.

Writes the same serial protocol the real hoop firmware will send, so the
browser's WebSerialDriver can be tested end-to-end without hardware.

Pair this with a virtual null-modem pair (com0com). Point this script at one
end (e.g. COM11); point Chrome's "CONNECT ARDUINO" dialog at the other (COM12).

Usage:
    py tools/hoop_sim.py --port COM11 --list
    py tools/hoop_sim.py --port COM11 interactive
    py tools/hoop_sim.py --port COM11 burst --count 10 --interval 2.0
    py tools/hoop_sim.py --port COM11 debounce
    py tools/hoop_sim.py --port COM11 round
    py tools/hoop_sim.py --port COM11 split
    py tools/hoop_sim.py --port COM11 noise
"""

import argparse
import random
import sys
import time

try:
    import serial
    from serial.tools import list_ports
except ImportError:
    sys.exit("pyserial missing. Install with:  py -m pip install pyserial")


# The real sketch prints these on power-up. Neither should ever score.
BOOT_LINES = ["SYSTEM:READY", "DEVICE:BASKETBALL_HOOP_V1"]


def log(tag, msg):
    print(f"[{time.strftime('%H:%M:%S')}] {tag:<9} {msg}", flush=True)


def send(port, line, tag="TX"):
    port.write(f"{line}\n".encode("ascii"))
    port.flush()
    log(tag, line)


def do_list():
    ports = list(list_ports.comports())
    if not ports:
        print("No serial ports found.")
        return
    print(f"{'PORT':<10} {'DESCRIPTION'}")
    for p in ports:
        print(f"{p.device:<10} {p.description}")
    print(
        "\nPick a com0com pair (often COM11/COM12). Bluetooth ports are not usable here."
    )


def mode_boot(port, _args):
    """Mimic the Uno rebooting when the port is opened."""
    for line in BOOT_LINES:
        send(port, line, "BOOT")
        time.sleep(0.1)
    log("INFO", "Boot handshake sent. Neither line should have scored.")


def mode_interactive(port, _args):
    log("INFO", "SPACE or ENTER = shoot.   q = quit.")
    try:
        import msvcrt

        while True:
            ch = msvcrt.getch()
            if ch in (b"q", b"\x1b", b"\x03"):
                break
            if ch in (b" ", b"\r", b"\n"):
                send(port, "SCORE:2")
    except ImportError:
        while True:
            line = sys.stdin.readline()
            if not line or line.strip().lower() == "q":
                break
            send(port, "SCORE:2")


def mode_burst(port, args):
    """Steady shots. THIS is the teardown-bug reproducer at --interval 2.0."""
    log("INFO", f"{args.count} shots, {args.interval}s apart.")
    log("INFO", "Watch the app: if only shot #1 scores, the port was torn down.")
    for i in range(1, args.count + 1):
        send(port, "SCORE:2", f"SHOT {i}")
        if i < args.count:
            time.sleep(args.interval)


def mode_debounce(port, _args):
    """Fire faster than the app's 400ms lockout. Most should be swallowed."""
    log("INFO", "12 shots at 100ms. App debounce is 400ms.")
    log("INFO", "Expect roughly 3 of 12 to score, not 12.")
    for i in range(1, 13):
        send(port, "SCORE:2", f"RAPID {i}")
        time.sleep(0.1)


def mode_round(port, _args):
    """A plausible 60-second round: some misses, some hot streaks."""
    log("INFO", "Simulating a 60s round. Start the round in the app first.")
    deadline = time.time() + 60
    shots = 0
    while time.time() < deadline:
        if random.random() < 0.35:
            # Hot streak - fast makes, should trip the ON FIRE state.
            for _ in range(random.randint(3, 5)):
                if time.time() >= deadline:
                    break
                send(port, "SCORE:2", "STREAK")
                shots += 1
                time.sleep(random.uniform(0.9, 1.6))
        else:
            send(port, "SCORE:2", "SHOT")
            shots += 1
            time.sleep(random.uniform(1.5, 4.0))
    log("INFO", f"Round complete. {shots} baskets sent.")


def mode_split(port, _args):
    """Split one packet across writes - exercises the reader's line buffer."""
    log("INFO", "Sending 'SCORE:2' in three fragments with gaps.")
    for chunk in ("SCO", "RE", ":2\n"):
        port.write(chunk.encode("ascii"))
        port.flush()
        log("FRAGMENT", repr(chunk))
        time.sleep(0.3)
    log("INFO", "Should register as exactly ONE basket, not zero and not three.")


def mode_noise(port, _args):
    """Junk the parser must ignore. Only the final line may score."""
    junk = [
        "",
        "   ",
        "SYSTEM:READY",
        "PONG",
        "DEVICE:BASKETBALL_HOOP_V1",
        "\x00\xff garbage",
        "SCORE:abc",
        "SCORE:-5",
        "SCORE:0",
    ]
    for line in junk:
        try:
            port.write(f"{line}\n".encode("ascii", errors="replace"))
            port.flush()
            log("JUNK", repr(line))
        except Exception as e:  # noqa: BLE001
            log("ERR", f"{line!r} -> {e}")
        time.sleep(0.25)
    log("INFO", "None of the above should have scored.")
    time.sleep(0.5)
    send(port, "SCORE:2", "VALID")
    log("INFO", "That last one SHOULD score - proves the parser still works.")


MODES = {
    "boot": mode_boot,
    "interactive": mode_interactive,
    "burst": mode_burst,
    "debounce": mode_debounce,
    "round": mode_round,
    "split": mode_split,
    "noise": mode_noise,
}


def main():
    ap = argparse.ArgumentParser(description="Fake Arduino hoop sensor.")
    ap.add_argument("--port", help="Serial port to write to, e.g. COM11")
    ap.add_argument("--baud", type=int, default=115200)
    ap.add_argument("--list", action="store_true", help="List ports and exit")
    ap.add_argument("--no-boot", action="store_true", help="Skip boot handshake")
    ap.add_argument("mode", nargs="?", default="interactive", choices=list(MODES))
    ap.add_argument("--count", type=int, default=10, help="burst: number of shots")
    ap.add_argument("--interval", type=float, default=2.0, help="burst: seconds apart")
    args = ap.parse_args()

    if args.list:
        do_list()
        return

    if not args.port:
        ap.error("--port is required (or use --list)")

    try:
        port = serial.Serial(args.port, args.baud, timeout=1)
    except serial.SerialException as e:
        sys.exit(f"Could not open {args.port}: {e}\nRun with --list to see ports.")

    log("OPEN", f"{args.port} @ {args.baud} baud")
    try:
        if not args.no_boot and args.mode != "boot":
            for line in BOOT_LINES:
                send(port, line, "BOOT")
                time.sleep(0.1)
            time.sleep(0.3)
        MODES[args.mode](port, args)
    except KeyboardInterrupt:
        print()
        log("INFO", "Interrupted.")
    finally:
        port.close()
        log("CLOSE", args.port)


if __name__ == "__main__":
    main()
