import { DarkTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ServicesScreen } from "../screens/ServicesScreen";
import { ServiceDetailScreen } from "../screens/ServiceDetailScreen";
import { IncidentsScreen } from "../screens/IncidentsScreen";
import { IncidentDetailScreen } from "../screens/IncidentDetailScreen";
import type { RootStackParamList, TabParamList } from "./types";
import { colors } from "../constants/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.critical,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          title: "Services",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Incidents"
        component={IncidentsScreen}
        options={{
          title: "Incidents",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "warning" : "warning-outline"} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="ServiceDetail"
          component={ServiceDetailScreen}
          options={({ route }) => ({ title: route.params.serviceName ?? "Service" })}
        />
        <Stack.Screen name="IncidentDetail" component={IncidentDetailScreen} options={{ title: "Incident" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
