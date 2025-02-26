#!/usr/bin/env python
# coding: utf-8


import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"


# In[6]:


from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
from fuzzywuzzy import process
import pandas as pd

# โหลด tokenizer และโมเดล WangchanBERTa ที่ปรับใช้กับภาษาไทย
tokenizer = AutoTokenizer.from_pretrained("airesearch/wangchanberta-base-att-spm-uncased", use_fast=False)
model = AutoModelForTokenClassification.from_pretrained("airesearch/wangchanberta-base-att-spm-uncased")

# สร้าง NER pipeline
ner_pipeline = pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")


# In[25]:


import re
import pymysql
from pythainlp.util import normalize
from pythainlp.tokenize import word_tokenize
from fuzzywuzzy import fuzz, process
import sys
import json
sys.stdout.reconfigure(encoding='utf-8')
def get_products_from_db():
    connection = pymysql.connect(
        host="localhost",
        user="root",
        password="root",
        database="Linebot",
        port=3306,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    with connection:
        with connection.cursor() as cursor:
            sql = "SELECT Product_id, Product_name FROM Product"
            cursor.execute(sql)
            products = cursor.fetchall()
    
    return products

# ✅ ดึงข้อมูลสินค้าจากฐานข้อมูล
products = get_products_from_db()
menu_db = {normalize(p["Product_name"]): p["Product_id"] for p in products}  # Dict {ชื่อสินค้า: ID}
          
def find_best_match(word, menu_db, threshold=80):
    match, score = process.extractOne(normalize(word), [normalize(m) for m in menu_db])
    return match if score >= threshold else None

def extract_orders(text):
    orders = []

    # 📌 ลบช่องว่างเกิน และ Normalize ข้อความ
    text = normalize(text.strip())
    text = re.sub(r'\s+', ' ', text)

    # 📌 ใช้ Regular Expression ค้นหาจำนวนที่อยู่ติดกับเมนู
    quantity_dict = {}
    matches = re.findall(r'(\D+)\s*(\d+)', text)  # เช่น "น้ำลำไย 4"
    for menu_name, qty in matches:
        quantity_dict[normalize(menu_name.strip())] = int(qty)

    # 📌 ตัดคำและแมตช์กับเมนู
    words = [w.strip() for w in word_tokenize(text) if w.strip()]
    detected_menus = set()

    for word in words:
        best_match = find_best_match(word, menu_db)
        if best_match and best_match not in detected_menus:
            quantity = quantity_dict.get(normalize(word), 1)  # ถ้าจำนวนไม่ระบุให้ใช้ 1
            orders.append({"menu": best_match, "quantity": quantity})
            detected_menus.add(best_match)  # ป้องกันเมนูซ้ำ

    return orders

if __name__ == "__main__":
    text_input = sys.argv[1]
    result = extract_orders(text_input)  # Model วิเคราะห์คำสั่งซื้อ

    # ✅ เพิ่ม product_id ลงใน JSON
    for order in result:
        if order["menu"] in menu_db:
            order["product_id"] = menu_db[order["menu"]]
        else:
            print(f"❌ ไม่พบสินค้าในฐานข้อมูล: {order['menu']}")
            order["product_id"] = None  # ถ้าหาไม่เจอให้เป็น None

    print(json.dumps(result, ensure_ascii=False))

