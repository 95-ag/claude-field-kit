# WSL Headed Browser

Running a headed browser from WSL against an X server on Windows (VcXsrv, Playwright). Headless is the default and
needs none of this.

## Finding the display host

- Take the X11 host address from `ip route show default`, not `/etc/resolv.conf` — that nameserver is the NAT
  gateway, unreachable for X11; the default gateway is the WSL adapter IP where VcXsrv listens.
- Hyper-V's NAT firewall applies no inbound rule to WSL2: `NATInboundRuleNotApplicable` means the rule was accepted
  and does nothing. Use the WSL adapter IP, not the NAT gateway's.

## Launching VcXsrv

- Launch it directly with `:1 -multiwindow -ac -noclipboard`, never through XLaunch — it passes `-displayfd` for a
  dynamic display, which breaks a fixed `:1`.
- `cmd.exe /c start` fails silently when the working directory is inside WSL, because it rejects UNC paths.
- Kill stray VcXsrv instances first; a duplicate breaks `:1`.

## Connecting

- Set `DISPLAY` before `sync_playwright()` starts — Playwright's Node driver copies the environment at that point,
  so a `DISPLAY` set later never reaches Chromium.
- Poll an `xdpyinfo` handshake before connecting; an open TCP port 6001 is not enough.
