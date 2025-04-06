# ใช้ Node.js image สำหรับการ build
FROM node:lts

# สร้าง directory ภายใน container
WORKDIR /app

# คัดลอก package.json และ lock file เข้าไป
COPY package*.json ./

COPY . .

# ติดตั้ง dependencies
RUN npm install

# คัดลอกไฟล์ทั้งหมดใน project เข้าไปใน container

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -s /usr/bin/python3 /usr/bin/python

RUN pip install --break-system-packages -r ./Model/requirement.txt

# เปิด port 8000
EXPOSE 8000

# รัน application
CMD ["node", "server.js"]
