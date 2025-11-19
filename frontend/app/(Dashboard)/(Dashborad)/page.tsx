"use client";

import { AdvancedNavbar } from "@/app/common/components/AdvancedNavbar";
import { Plus, DollarSign, Tag, Star, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const handleSearch = (query: string) => {
    console.log("Searching:", query);
  };
  const handleFiltersChange = (filters: any[]) => {
    console.log("Filters applied:", filters);
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <AdvancedNavbar
        title="BevFlow Dashboard"
        createButtons={[
          { label: "New Brand", onClick: () => alert("Brand created"), icon: <Plus /> },
          { label: "New Product", onClick: () => alert("Product created"), icon: <Layers /> },
          { label: "New Order", onClick: () => alert("Order created"), icon: <DollarSign /> },
        ]}
        searchSuggestions={[
          "Coca Cola", "Pepsi", "Fanta", "Sprite", "Red Bull", "Mirinda", "Mountain Dew"
        ]}
        onSearch={handleSearch}
      />

      {/* Dashboard content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle>Total Sales</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">$12,345</CardContent>
          </Card>

          <Card className="bg-gray-800 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">256</CardContent>
          </Card>

          <Card className="bg-gray-800 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">128</CardContent>
          </Card>

          <Card className="bg-gray-800 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">76</CardContent>
          </Card>
        </div>

        {/* Table / Recent Orders */}
        <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-700 text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-gray-300">Order ID</th>
                <th className="px-6 py-3 text-left text-gray-300">Customer</th>
                <th className="px-6 py-3 text-left text-gray-300">Product</th>
                <th className="px-6 py-3 text-left text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-gray-300">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {[
                { id: "#001", customer: "John Doe", product: "Coca Cola", status: "Completed", amount: "$20" },
                { id: "#002", customer: "Jane Smith", product: "Pepsi", status: "Pending", amount: "$15" },
                { id: "#003", customer: "Mike Johnson", product: "Fanta", status: "Cancelled", amount: "$10" },
                { id: "#004", customer: "Sara Lee", product: "Red Bull", status: "Completed", amount: "$30" },
              ].map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-3">{order.id}</td>
                  <td className="px-6 py-3">{order.customer}</td>
                  <td className="px-6 py-3">{order.product}</td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={
                        order.status === "Completed"
                          ? "secondary"
                          : order.status === "Pending"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3">{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Additional Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800 shadow-lg hover:shadow-xl transition-all p-4">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Coca Cola", "Pepsi", "Fanta"].map((p) => (
                  <li key={p} className="flex justify-between">
                    <span>{p}</span>
                    <span className="font-bold">50 sold</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 shadow-lg hover:shadow-xl transition-all p-4">
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">$12,345</CardContent>
          </Card>

          <Card className="bg-gray-800 shadow-lg hover:shadow-xl transition-all p-4">
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["John Doe", "Jane Smith", "Mike Johnson"].map((c) => (
                  <li key={c} className="flex justify-between">
                    <span>{c}</span>
                    <span className="font-bold">5 orders</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}