import { mlService } from './mlService.js';

const SAMPLE_CUSTOMERS = [
  { id: 'CUST_4082', age: 28, isMale: 0, premier: 1, country: 'Country_A', sales: 18, returns: 3, rate: 0.166 },
  { id: 'CUST_9103', age: 34, isMale: 1, premier: 0, country: 'Country_G', sales: 12, returns: 9, rate: 0.750 },
  { id: 'CUST_1145', age: 22, isMale: 0, premier: 0, country: 'Country_B', sales: 6, returns: 4, rate: 0.667 },
  { id: 'CUST_6290', age: 45, isMale: 0, premier: 1, country: 'Country_E', sales: 25, returns: 2, rate: 0.080 },
  { id: 'CUST_7721', age: 31, isMale: 1, premier: 0, country: 'Country_C', sales: 15, returns: 10, rate: 0.667 },
  { id: 'CUST_3309', age: 26, isMale: 0, premier: 0, country: 'Country_A', sales: 8, returns: 1, rate: 0.125 }
];

const SAMPLE_PRODUCTS = [
  { id: 'SKU_902', type: 'Dresses', brand: 'Brand_K', price: 68.0, discount: 12.0, prodRate: 0.58 },
  { id: 'SKU_411', type: 'Tops', brand: 'Brand_A', price: 28.0, discount: 0.0, prodRate: 0.18 },
  { id: 'SKU_855', type: 'Shoes', brand: 'Brand_B', price: 85.0, discount: 15.0, prodRate: 0.62 },
  { id: 'SKU_120', type: 'Jeans', brand: 'Brand_C', price: 42.0, discount: 5.0, prodRate: 0.44 },
  { id: 'SKU_670', type: 'productType_B', brand: 'Brand_G', price: 35.0, discount: 0.0, prodRate: 0.22 }
];

export const streamService = {
  getRecentTransactions(count = 10) {
    const list = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const cust = SAMPLE_CUSTOMERS[i % SAMPLE_CUSTOMERS.length];
      const prod = SAMPLE_PRODUCTS[(i * 2 + 1) % SAMPLE_PRODUCTS.length];
      
      const isHigh = cust.rate > 0.4 || prod.prodRate > 0.45;
      const prob = isHigh ? +(0.65 + Math.random() * 0.32).toFixed(4) : +(0.05 + Math.random() * 0.25).toFixed(4);
      
      let risk_category = 'LOW';
      let decision = 'PROCEED_NORMALLY';
      if (prob >= 0.8) {
        risk_category = 'VERY_HIGH';
        decision = 'MANUAL_REVIEW_OR_PREPAID';
      } else if (prob >= 0.6) {
        risk_category = 'HIGH';
        decision = 'ADDITIONAL_VERIFICATION';
      } else if (prob >= 0.3) {
        risk_category = 'MEDIUM';
        decision = 'MONITOR_ORDER';
      }

      list.push({
        id: `TXN-${100000 + i}`,
        timestamp: new Date(now - i * 14000).toISOString(),
        customerId: cust.id,
        country: cust.country,
        product: `${prod.brand} ${prod.type}`,
        price: prod.price,
        discount: prod.discount,
        customerReturnRate: cust.rate,
        productReturnRate: prod.prodRate,
        return_probability: prob,
        risk_category,
        decision,
        expected_loss: +(prob * 25.0).toFixed(2),
        status: prob >= 0.19 ? 'INTERCEPTED' : 'CLEARED'
      });
    }

    return list;
  }
};
