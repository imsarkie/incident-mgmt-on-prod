import { StrictMode } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NetworkProvider } from "./src/context/NetworkContext";
import { ConnectionProvider } from "./src/context/ConnectionContext";
import { OfflineBanner } from "./src/components/OfflineBanner";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <StrictMode>
      <SafeAreaProvider>
        <NetworkProvider>
          <ConnectionProvider>
            <OfflineBanner />
            <RootNavigator />
            <StatusBar style="light" />
          </ConnectionProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </StrictMode>
  );
}
