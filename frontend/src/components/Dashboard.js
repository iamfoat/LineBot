import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/Dashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/dashboard");
      setData(res.data);
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
    }
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <div className="header-container ">
        <h1 className="header">Ingredient</h1>
      </div>

      <div className="stats">
        <div className="card">
          <h3>📦 ยอดขาย</h3>
          <p>{data.totalSales} ชิ้น</p>
        </div>
        <div className="card">
          <h3>💰 รายรับ</h3>
          <p>{data.totalRevenue.toLocaleString()} บาท</p>
        </div>
        <div className="card">
          <h3>📉 รายจ่าย</h3>
          <p>{data.totalExpenses.toLocaleString()} บาท</p>
        </div>
        <div className="card">
          <h3>💵 กำไร</h3>
          <p>{data.totalProfit.toLocaleString()} บาท</p>
        </div>
      </div>

      <h3>📈 กราฟรายรับ & รายจ่าย</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={[
            { name: "รายรับ", value: data.totalRevenue },
            { name: "รายจ่าย", value: data.totalExpenses },
            { name: "กำไร", value: data.totalProfit },
          ]}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#4CAF50" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Dashboard;
