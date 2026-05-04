import requests
from bs4 import BeautifulSoup
import json
import random
import os

def get_fallback_data():
    """Returns a hardcoded sample dataset if Amazon blocks the request."""
    print("Amazon blocked the request. Using fallback dataset...")
    return [
        {
            "Title": "High-Performance Gaming Laptop",
            "Price": "$1,299.00",
            "Description": "A powerful gaming laptop with 16GB RAM and 1TB SSD.",
            "Features": ["16GB RAM", "1TB SSD", "RTX 3060", "144Hz Display"],
            "Reviews": [f"Review {i} for Laptop" for i in range(1, 16)]
        },
        {
            "Title": "Fitness Smartwatch with Heart Rate Monitor",
            "Price": "$199.99",
            "Description": "Track your fitness goals with this advanced smartwatch.",
            "Features": ["Heart Rate Monitor", "GPS", "Water Resistant", "7-Day Battery"],
            "Reviews": [f"Review {i} for Smartwatch" for i in range(1, 16)]
        },
        {
            "Title": "Noise Cancelling Wireless Headphones",
            "Price": "$299.50",
            "Description": "Experience immersive audio with industry-leading noise cancellation.",
            "Features": ["Active Noise Cancellation", "30-Hour Battery", "Bluetooth 5.0", "Built-in Mic"],
            "Reviews": [f"Review {i} for Headphones" for i in range(1, 16)]
        }
    ]

def scrape_amazon_product(url):
    """Scrapes product details from an Amazon URL."""
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0"
    ]
    
    headers = {
        "User-Agent": random.choice(user_agents),
        "Accept-Language": "en-US, en;q=0.5",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 503:
            print(f"Status 503: Request blocked by Amazon.")
            return get_fallback_data()
            
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        title_element = soup.find("span", attrs={"id": 'productTitle'})
        title = title_element.text.strip() if title_element else "Title not found"
        
        price_element = soup.find("span", attrs={"class": 'a-price-whole'})
        price_fraction = soup.find("span", attrs={"class": 'a-price-fraction'})
        price_symbol = soup.find("span", attrs={"class": 'a-price-symbol'})
        
        if price_element and price_fraction and price_symbol:
            price = f"{price_symbol.text}{price_element.text}{price_fraction.text}"
        else:
            price_element_alt = soup.find("span", attrs={"class": "a-offscreen"})
            price = price_element_alt.text.strip() if price_element_alt else "Price not found"
            
        desc_element = soup.find("div", attrs={"id": "productDescription"})
        description = desc_element.text.strip() if desc_element else "Description not found"
        
        features = []
        feature_list = soup.find("ul", attrs={"class": "a-unordered-list a-vertical a-spacing-mini"})
        if feature_list:
            for item in feature_list.find_all("li"):
                features.append(item.text.strip())
                
        reviews = []
        review_elements = soup.find_all("div", attrs={"data-hook": "review-collapsed"})
        for review in review_elements:
            reviews.append(review.text.strip())
            if len(reviews) >= 15:
                break
                
        if title == "Title not found" and price == "Price not found":
            print("Failed to parse page elements correctly. Returning fallback data.")
            return get_fallback_data()

        product_data = {
            "Title": title,
            "Price": price,
            "Description": description,
            "Features": features,
            "Reviews": reviews
        }
        
        return [product_data]

    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return get_fallback_data()

def save_to_json(data, filename):
    """Saves data to a JSON file."""
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print(f"Data saved to {filename}")

if __name__ == "__main__":
    amazon_url = "https://www.amazon.com/dp/B08F7PTF54"
    print(f"Scraping URL: {amazon_url}")
    scraped_data = scrape_amazon_product(amazon_url)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(os.path.dirname(script_dir), "data")
    output_file = os.path.join(data_dir, "products.json")
    
    save_to_json(scraped_data, output_file)
