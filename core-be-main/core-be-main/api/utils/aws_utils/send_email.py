from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import boto3
from botocore.exceptions import ClientError


def get_aws_ses_client():
    """
    This function is used to create an instance of AWS SES service
    :return: AWS SES client object
    """
    try:
        boto_client = boto3.client('ses')
        return boto_client
    except ClientError as e:
        raise e


def send_email(
        to_addr=None, sender=None, body=None,
        attachment=None, subject=None, file_name=None,
        html_mode=None, text_mode=None, cc_addr=None, from_str=None):
    """
    This is a common function which can be used to send the email with the given details
    :param to_addr: This is a list of email address to which email would be sent
    :param sender: This is the sender email address from which an email would be initiated
    :param body: This is the actual message of the email
    :param attachment: This would be a file object which would be passed as attachment
    :param subject: The subject line for the email
    :param file_name: FIle name of attachment
    :param html_mode: If body is in html
    :param text_mode: If body is in text
    :param cc_addr: CC addresses
    :param from_str: This would be Display name for From Header
    :return: This would return success or Error detail
    """
    try:
        boto_client = get_aws_ses_client()

        # The character encoding for the email.
        char_set = "utf-8"

        # Create a multipart parent container.
        msg = MIMEMultipart()
        # Add subject lines.
        msg['Subject'] = subject
        msg['From'] = from_str
        msg['To'] = ', '.join(to_addr)
        msg['CC'] = ', '.join(cc_addr)

        # Encode the text and HTML content and set the character encoding. This step is
        # necessary if we're sending a message with characters outside the ASCII range.
        if text_mode:
            text_part = MIMEText(body.encode(char_set), 'plain', char_set)
            # Add the text part to the Parent container.
            msg.attach(text_part)

        if html_mode:
            html_part = MIMEText(body.encode(char_set), 'html', char_set)
            # Add the HTML part to the Parent container.
            msg.attach(html_part)

        if attachment and file_name:
            # Define the attachment part and encode it using MIMEApplication.
            part = MIMEApplication(attachment.read())
            # Add a header to tell the email client to treat this part as an attachment,
            # and to give the attachment a name.
            part.add_header('Content-Disposition', 'attachment', filename=file_name)
            # Add the attachment to the parent container.
            msg.attach(part)

        # Provide the contents of the email.
        return boto_client.send_raw_email(
            Source=sender,
            RawMessage={
                'Data': msg.as_string()
            }
        )
    except ClientError as e:
        raise e
    except Exception as e:
        raise e
