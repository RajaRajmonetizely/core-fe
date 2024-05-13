import uuid
from datetime import datetime


class CommonUtils:

    def convert_uuids_to_strings(data_dict):
        converted_data = {}
        for key, value in data_dict.items():
            if isinstance(value, (uuid.UUID, datetime)):
                converted_data[key] = str(value)
            else:
                converted_data[key] = value
        return converted_data