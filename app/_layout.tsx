import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f1a0f" },
          headerTintColor: "#c8e6c8",
          headerTitleStyle: { fontWeight: "600", color: "#c8e6c8" },
          contentStyle: { backgroundColor: "#0a0f0a" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="profiles" options={{ headerShown: false }} />
        <Stack.Screen name="profile/new" options={{ title: "New Profile", presentation: "modal" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/new" options={{ title: "New Item", presentation: "modal" }} />
        <Stack.Screen name="item/[id]" options={{ title: "Item" }} />
        <Stack.Screen name="item/[id]/edit" options={{ title: "Edit Item", presentation: "modal" }} />
        <Stack.Screen name="evaluate/new" options={{ title: "Evaluate a Buy", presentation: "modal" }} />
        <Stack.Screen name="evaluate/[id]" options={{ title: "Evaluation" }} />
        <Stack.Screen name="evaluate/[id]/edit" options={{ title: "Edit Evaluation", presentation: "modal" }} />
        <Stack.Screen name="expenses" options={{ title: "Expenses", presentation: "modal" }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
