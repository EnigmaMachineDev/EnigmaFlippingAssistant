import { Tabs, Redirect } from "expo-router";
import React from "react";
import { LayoutDashboard, Package, Calculator, BarChart2, Settings, ShoppingBag } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { useStore } from "@/lib/store";
import { useActiveProfile } from "@/hooks/useProfile";

export default function TabLayout() {
  const activeProfileId = useStore((s) => s.activeProfileId);
  const profile = useActiveProfile();

  if (!activeProfileId) return <Redirect href="/profiles" />;

  const isCatalog = profile?.kind === "catalog";

  const tabOptions = {
    tabBarActiveTintColor: Colors.tabActive,
    tabBarInactiveTintColor: Colors.tabInactive,
    tabBarStyle: {
      backgroundColor: Colors.panel,
      borderTopColor: Colors.border,
      borderTopWidth: 1,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: "500" as const },
    headerStyle: { backgroundColor: Colors.panel },
    headerTintColor: Colors.text,
    headerTitleStyle: { fontWeight: "600" as const, color: Colors.text },
    headerShadowVisible: false,
  };

  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      {/* Flip: Inventory; Catalog: Products */}
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          href: isCatalog ? null : undefined,
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Products",
          href: isCatalog ? undefined : null,
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      {/* Flip: Prospects; Catalog: Sales */}
      <Tabs.Screen
        name="prospects"
        options={{
          title: "Prospects",
          href: isCatalog ? null : undefined,
          tabBarIcon: ({ color, size }) => <Calculator size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          href: isCatalog ? undefined : null,
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          href: isCatalog ? null : undefined,
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
