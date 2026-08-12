import { Platform } from "react-native";

/**
 * Android emulators run in their own virtual network — "localhost" on the emulator
 * refers to the emulator itself, not your dev machine. 10.0.2.2 is the Android
 * emulator's special alias back to the host machine's localhost.
 *
 * Testing on a physical device (Expo Go) instead? Replace this with your machine's
 * LAN IP, e.g. "http://192.168.1.23:4000" — see docs/14-api-integration.md.
 */
export const API_BASE_URL = Platform.select({
  android: "http://10.0.2.2:4000",
  default: "http://localhost:4000",
});

export const WS_URL = Platform.select({
  android: "ws://10.0.2.2:4000/ws",
  default: "ws://localhost:4000/ws",
});
