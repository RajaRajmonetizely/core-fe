from django.urls import path


from api.pricing_calculator.views.quote import PricingCalculatorView, \
    PricingCalculatorDetailView, QuoteCommentView
from api.pricing_calculator.views.quote_approval import QuoteApprovalView
from api.pricing_calculator.views.quote_forward import QuoteForwardView, QuoteResendView, \
    QuoteStatusView

urlpatterns = [
    path("", PricingCalculatorView.as_view(), name="pricing-calculator"),
    path("/<str:id>", PricingCalculatorDetailView.as_view(), name="pricing-calculator"),
    path("/<str:id>/comments", QuoteCommentView.as_view(), name="quote-comment"),
    path("/<str:id>/forward", QuoteForwardView.as_view(), name="quote-forward-to-DD"),
    path("/<str:id>/approval", QuoteApprovalView.as_view(), name="quote-approval"),
    path("/<str:id>/resend", QuoteResendView.as_view(), name="quote-resend"),
    path("/<str:id>/status", QuoteStatusView.as_view(), name="quote-status")
]
