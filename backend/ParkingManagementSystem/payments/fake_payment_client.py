class FakePaymentClient:
    def create_order(self, amount, currency="INR", receipt=None, notes=None):
        """
        Create a fake order
        """
        return {
            "id": "fake_order_id",
            "amount": amount,
            "currency": currency,
            "receipt": receipt,
            "notes": notes
        }

    def verify_payment(self, payment_id, order_id, signature):
        """
        Verify fake payment signature
        """
        return True

    def refund_payment(self, payment_id, amount=None):
        """
        Refund a fake payment
        """
        return {
            "id": "fake_refund_id",
            "amount": amount,
            "status": "refunded"
        }
