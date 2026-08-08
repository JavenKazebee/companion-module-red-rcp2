# RED RCP2 Module

Control RED DSMC3 cameras from Companion via the RCP2 protocol over your network.

# Compatibility

Compatible with all RED cameras using the RCP2 protocol (DSMC3 line). Tested and verified with:

- Komodo
- Komodo-X
- V-Raptor (VV and Super35)

# Configuration

## On the camera

1. Open **Communication → Connections → Wi‑Fi** on the camera.
2. Set the Wi‑Fi mode to **Infrastructure**.
3. Join the same network as the machine running Companion (same subnet).
4. After connecting, note the camera’s **IP address** to enter it in Companion.

## In Companion

- **IP address** — The camera’s IP address (from the camera’s Wi‑Fi/network screen). Must be on the same network as Companion.
- **Reconnect attempt rate (seconds)** — How often the module retries if the connection is lost (1–3600 seconds, default: 10).
- **Camera Model** — Which camera this instance is talking to (Komodo / Komodo-X / V-Raptor). Komodo and Komodo-X support the same set of parameters; V-Raptor supports some the others don't (and vice versa). Actions and variables are scoped to whichever model you pick, so choose the one that actually matches your camera.

# Actions and variables

Every action and variable in this module corresponds directly to a parameter documented in RED's own RCP2 API manuals, with the action/variable name matching RED's parameter name lowercased (e.g. the documented `EXPOSURE_ANGLE` parameter is the `exposure_angle` action and variable). If you're unsure what a specific action or variable does, RED's RCP2 API documentation (available from red.com) is the authoritative reference — search it for the parameter name in capitals.

A few parameters don't map cleanly to a single action/variable and are handled separately: the `cdl_*` variables come from the camera's composite CDL report rather than an individual parameter, and the **Generic** action lets you send any RCP2 command id/argument directly, for anything not otherwise covered.

# Troubleshooting

- **Connection fails or “Camera connection failed”**  
  - Confirm the camera is powered on and connected to the same network as Companion.  
  - Confirm the IP in Companion matches the camera’s current IP (it can change if using DHCP).  
  - Check that no firewall is blocking the RCP2 port between Companion and the camera.

- **Camera not on the same network**  
  - Use Infrastructure mode (not ad‑hoc). Ensure the camera and Companion host are on the same subnet (e.g. same Wi‑Fi or same wired LAN).
