# ใช้ Node.js image สำหรับการ build
FROM node:14

# สร้าง directory ภายใน container
WORKDIR /app

# คัดลอก package.json และ lock file เข้าไป
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกไฟล์ทั้งหมดใน project เข้าไปใน container
COPY . .

# เปิด port 8000
EXPOSE 8000

# รัน application
CMD ["node", "server.js"]
