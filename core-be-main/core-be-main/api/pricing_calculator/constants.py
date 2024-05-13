import os

QUOTE_URL = os.getenv("QUOTE_URL", "https://qa.getmonetizely.com/pricing-calculator/{}")


class QuoteStatus:
    DRAFT = 'draft'
    FORWARD_TO_DD = 'forwarded_to_deal_desk'
    ESCALATE_FOR_APPROVAL = 'escalate_for_approval'
    APPROVED = 'approved'


SENDER = os.getenv("SENDER")
FROM_STR = 'System Notification <{}>'.format(SENDER)
