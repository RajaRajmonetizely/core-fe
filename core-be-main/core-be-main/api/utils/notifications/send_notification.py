from jinja2 import Environment
from jinja2 import FileSystemLoader

from api.utils.aws_utils.send_email import send_email
from api.utils.logger import logger


class Notifications:
    def __init__(self, template_path, template_name, payload):
        environment = Environment(loader=FileSystemLoader(template_path))
        self.template_object = environment.get_template(template_name)
        self.payload = payload

    def send_email_notification(self):
        html_body = self.render_email_template()
        try:
            response = send_email(
                to_addr=self.payload.get('to_addr'), body=html_body,
                sender=self.payload.get('sender'),
                subject=self.payload.get('subject'), html_mode=True,
                cc_addr=self.payload.get('cc_addr'), from_str=self.payload.get('from_str'),
                attachment=self.payload.get('attachment'), file_name=self.payload.get('file_name')
            )
            logger.info(f'send email response - {response}')
            if response and response.get('ResponseMetadata').get('HTTPStatusCode') == 200:
                return True
        except Exception as e:
            logger.exception(f'Error in send email notification - {str(e)}')
            return False

    def render_email_template(self):
        html_body = self.template_object.render(data=self.payload.get('data'))
        return html_body
