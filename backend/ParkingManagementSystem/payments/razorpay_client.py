# Here's a step-by-step implementation of the booking flow with integration points

# 1. First, let's create a payment integration file
# payments/razorpay_client.py

import razorpay
from django.conf import settings

class RazorpayClient:
    def __init__(self):
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    
    def create_order(self, amount, currency="INR", receipt=None, notes=None):
        """
        Create a Razorpay order
        amount - in paise (e.g. 10000 for ₹100)
        """
        data = {
            "amount": int(amount * 100),  # Razorpay expects amount in paise
            "currency": currency,
            "receipt": receipt,
            "notes": notes
        }
        return self.client.order.create(data=data)
    
    def verify_payment(self, payment_id, order_id, signature):
        """
        Verify payment signature
        """
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_payment_id': payment_id,
                'razorpay_order_id': order_id,
                'razorpay_signature': signature
            })
            return True
        except Exception as e:
            return False
    
    def refund_payment(self, payment_id, amount=None):
        """
        Refund a payment
        amount - in paise (e.g. 10000 for ₹100), if None, full amount is refunded
        """
        try:
            if amount:
                refund_data = {"amount": int(amount * 100)}
                return self.client.payment.refund(payment_id, refund_data)
            else:
                return self.client.payment.refund(payment_id)
        except Exception as e:
            return None


