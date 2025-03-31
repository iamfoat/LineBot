{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 1,
   "id": "1348ff9e-88db-4bbd-935a-8a37237c671b",
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "Requirement already satisfied: transformers in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (4.48.3)\n",
      "Requirement already satisfied: pythainlp in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (5.0.5)\n",
      "Requirement already satisfied: torch in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (2.6.0)\n",
      "Requirement already satisfied: filelock in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (3.17.0)\n",
      "Requirement already satisfied: huggingface-hub<1.0,>=0.24.0 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (0.28.1)\n",
      "Requirement already satisfied: numpy>=1.17 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (1.26.4)\n",
      "Requirement already satisfied: packaging>=20.0 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (23.2)\n",
      "Requirement already satisfied: pyyaml>=5.1 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (6.0.2)\n",
      "Requirement already satisfied: regex!=2019.12.17 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (2024.11.6)\n",
      "Requirement already satisfied: requests in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (2.32.3)\n",
      "Requirement already satisfied: tokenizers<0.22,>=0.21 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (0.21.0)\n",
      "Requirement already satisfied: safetensors>=0.4.1 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (0.5.2)\n",
      "Requirement already satisfied: tqdm>=4.27 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from transformers) (4.67.1)\n",
      "Requirement already satisfied: tzdata in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from pythainlp) (2024.1)\n",
      "Requirement already satisfied: typing-extensions>=4.10.0 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from torch) (4.12.2)\n",
      "Requirement already satisfied: networkx in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from torch) (3.4.2)\n",
      "Requirement already satisfied: jinja2 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from torch) (3.1.5)\n",
      "Requirement already satisfied: fsspec in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from torch) (2025.2.0)\n",
      "Requirement already satisfied: sympy==1.13.1 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from torch) (1.13.1)\n",
      "Requirement already satisfied: mpmath<1.4,>=1.1.0 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from sympy==1.13.1->torch) (1.3.0)\n",
      "Requirement already satisfied: charset-normalizer<4,>=2 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from requests->transformers) (3.4.1)\n",
      "Requirement already satisfied: idna<4,>=2.5 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from requests->transformers) (3.10)\n",
      "Requirement already satisfied: urllib3<3,>=1.21.1 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from requests->transformers) (2.3.0)\n",
      "Requirement already satisfied: certifi>=2017.4.17 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from requests->transformers) (2025.1.31)\n",
      "Requirement already satisfied: colorama in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from tqdm>=4.27->transformers) (0.4.6)\n",
      "Requirement already satisfied: MarkupSafe>=2.0 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from jinja2->torch) (3.0.2)\n",
      "Note: you may need to restart the kernel to use updated packages.\n"
     ]
    },
    {
     "name": "stderr",
     "output_type": "stream",
     "text": [
      "\n",
      "[notice] A new release of pip is available: 25.0 -> 25.0.1\n",
      "[notice] To update, run: python.exe -m pip install --upgrade pip\n"
     ]
    }
   ],
   "source": [
    "pip install transformers pythainlp torch"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 1,
   "id": "7d7d74d5-28eb-40a1-8fc0-687ed0e2df98",
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "Requirement already satisfied: fuzzywuzzy[speedup] in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (0.18.0)\n",
      "Requirement already satisfied: python-levenshtein>=0.12 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from fuzzywuzzy[speedup]) (0.26.1)\n",
      "Requirement already satisfied: Levenshtein==0.26.1 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from python-levenshtein>=0.12->fuzzywuzzy[speedup]) (0.26.1)\n",
      "Requirement already satisfied: rapidfuzz<4.0.0,>=3.9.0 in c:\\users\\acer\\appdata\\local\\programs\\python\\python310\\lib\\site-packages (from Levenshtein==0.26.1->python-levenshtein>=0.12->fuzzywuzzy[speedup]) (3.12.1)\n",
      "Note: you may need to restart the kernel to use updated packages.\n"
     ]
    },
    {
     "name": "stderr",
     "output_type": "stream",
     "text": [
      "\n",
      "[notice] A new release of pip is available: 25.0 -> 25.0.1\n",
      "[notice] To update, run: python.exe -m pip install --upgrade pip\n"
     ]
    }
   ],
   "source": [
    "pip install fuzzywuzzy[speedup]"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 2,
   "id": "3322fab9-a39b-46e2-a1eb-e0dce2366f07",
   "metadata": {},
   "outputs": [],
   "source": [
    "import os\n",
    "os.environ[\"HF_HUB_DISABLE_SYMLINKS_WARNING\"] = \"1\""
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 3,
   "id": "f207da19-3f73-46e3-a0d8-36c34c07a5ed",
   "metadata": {},
   "outputs": [
    {
     "data": {
      "application/vnd.jupyter.widget-view+json": {
       "model_id": "85d0cc1178914e2480d54e710f11235e",
       "version_major": 2,
       "version_minor": 0
      },
      "text/plain": [
       "  0%|          | 0/10 [00:00<?, ?it/s]"
      ]
     },
     "metadata": {},
     "output_type": "display_data"
    }
   ],
   "source": [
    "from tqdm.notebook import tqdm\n",
    "import time\n",
    "\n",
    "# ตัวอย่าง Progress Bar\n",
    "for i in tqdm(range(10)):\n",
    "    time.sleep(0.5)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 6,
   "id": "2c96a727-7764-4e91-86e6-bab719ac1f50",
   "metadata": {},
   "outputs": [
    {
     "name": "stderr",
     "output_type": "stream",
     "text": [
      "Some weights of CamembertForTokenClassification were not initialized from the model checkpoint at airesearch/wangchanberta-base-att-spm-uncased and are newly initialized: ['classifier.bias', 'classifier.weight']\n",
      "You should probably TRAIN this model on a down-stream task to be able to use it for predictions and inference.\n",
      "Device set to use cpu\n"
     ]
    }
   ],
   "source": [
    "from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline\n",
    "from fuzzywuzzy import process\n",
    "import pandas as pd\n",
    "\n",
    "# โหลด tokenizer และโมเดล WangchanBERTa ที่ปรับใช้กับภาษาไทย\n",
    "tokenizer = AutoTokenizer.from_pretrained(\"airesearch/wangchanberta-base-att-spm-uncased\", use_fast=False)\n",
    "model = AutoModelForTokenClassification.from_pretrained(\"airesearch/wangchanberta-base-att-spm-uncased\")\n",
    "\n",
    "# สร้าง NER pipeline\n",
    "ner_pipeline = pipeline(\"ner\", model=model, tokenizer=tokenizer, aggregation_strategy=\"simple\")\n",
    "\n",
    "products = pd.DataFrame([\n",
    "    {\"Product_id\": 8, \"Product_name\": \"น้ำแตงโมปั่น\"},\n",
    "    {\"Product_id\": 9, \"Product_name\": \"น้ำสตรอเบอร์รี่ปั่น\"},\n",
    "    {\"Product_id\": 11, \"Product_name\": \"น้ำกล้วยปั่น\"},\n",
    "    {\"Product_id\": 12, \"Product_name\": \"น้ำส้มปั่น\"}\n",
    "])"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 25,
   "id": "52f37c94-1182-4b72-bc85-7be4ff6511cb",
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "📌 คำสั่งซื้อที่ดึงมา: [{'menu': 'น้ำส้มปั่น', 'quantity': 4}, {'menu': 'น้ำแตงโมปั่น', 'quantity': 1}]\n"
     ]
    }
   ],
   "source": [
    "import re\n",
    "import pymysql\n",
    "from pythainlp.util import normalize\n",
    "from pythainlp.tokenize import word_tokenize\n",
    "from fuzzywuzzy import fuzz, process\n",
    "\n",
    "def get_products_from_db():\n",
    "    \"\"\"\n",
    "    ดึงข้อมูลสินค้า (Product_id, Product_name) จากฐานข้อมูล\n",
    "    \"\"\"\n",
    "    connection = pymysql.connect(\n",
    "        host=\"localhost\",\n",
    "        user=\"root\",\n",
    "        password=\"root\",\n",
    "        database=\"Linebot\",\n",
    "        port=3306,\n",
    "        cursorclass=pymysql.cursors.DictCursor\n",
    "    )\n",
    "    \n",
    "    with connection:\n",
    "        with connection.cursor() as cursor:\n",
    "            sql = \"SELECT Product_id, Product_name FROM Product\"\n",
    "            cursor.execute(sql)\n",
    "            products = cursor.fetchall()\n",
    "    \n",
    "    return products\n",
    "\n",
    "# ✅ ดึงข้อมูลสินค้าจากฐานข้อมูล\n",
    "products = get_products_from_db()\n",
    "menu_db = {normalize(p[\"Product_name\"]): p[\"Product_id\"] for p in products}  # Dict {ชื่อสินค้า: ID}\n",
    "\n",
    "def find_best_match(word, menu_db, threshold=80):\n",
    "    \"\"\"\n",
    "    หาเมนูที่ใกล้เคียงที่สุดจากฐานข้อมูลสินค้า\n",
    "    \"\"\"\n",
    "    match, score = process.extractOne(normalize(word), [normalize(m) for m in menu_db])\n",
    "    return match if score >= threshold else None\n",
    "\n",
    "def extract_orders(text):\n",
    "    \"\"\"\n",
    "    แยกคำสั่งซื้อออกจากข้อความ\n",
    "    \"\"\"\n",
    "    orders = []\n",
    "\n",
    "    # 📌 ลบช่องว่างเกิน และ Normalize ข้อความ\n",
    "    text = normalize(text.strip())\n",
    "    text = re.sub(r'\\s+', ' ', text)\n",
    "\n",
    "    # 📌 ใช้ Regular Expression ค้นหาจำนวนที่อยู่ติดกับเมนู\n",
    "    quantity_dict = {}\n",
    "    matches = re.findall(r'(\\D+)\\s*(\\d+)', text)  # เช่น \"น้ำลำไย 4\"\n",
    "    for menu_name, qty in matches:\n",
    "        quantity_dict[normalize(menu_name.strip())] = int(qty)\n",
    "\n",
    "    # 📌 ตัดคำและแมตช์กับเมนู\n",
    "    words = [w.strip() for w in word_tokenize(text) if w.strip()]\n",
    "    detected_menus = set()\n",
    "\n",
    "    for word in words:\n",
    "        best_match = find_best_match(word, menu_db)\n",
    "        if best_match and best_match not in detected_menus:\n",
    "            quantity = quantity_dict.get(normalize(word), 1)  # ถ้าจำนวนไม่ระบุให้ใช้ 1\n",
    "            orders.append({\"menu\": best_match, \"quantity\": quantity})\n",
    "            detected_menus.add(best_match)  # ป้องกันเมนูซ้ำ\n",
    "\n",
    "    return orders\n",
    "\n",
    "# 📌 ทดสอบ\n",
    "text = \"น้ำส้ม 4 น้ำแตงโม 1 \"\n",
    "orders = extract_orders(text)\n",
    "print(\"📌 คำสั่งซื้อที่ดึงมา:\", orders)\n"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 15,
   "id": "eae8c902-7ad3-40ed-89e9-4611e5e485ec",
   "metadata": {},
   "outputs": [],
   "source": []
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "a424c860-488b-4c61-9df8-4f09bcf50f24",
   "metadata": {},
   "outputs": [],
   "source": []
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.10.4"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5
}
