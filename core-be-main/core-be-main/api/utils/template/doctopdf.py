import os
import re
import shutil
import subprocess
import tarfile
from io import BytesIO

import brotli
import docx2txt
from docxtpl import DocxTemplate

from api.utils.aws_utils.s3 import S3Service
from api.utils.logger import logger


class DocxToPdfConverter:
    def __init__(self):
        self.libreoffice_path = None
        self.libreoffice_install_dir = "/tmp/libre"
        self.output_dir = "/tmp/output_dir"

    def load_libreoffice(self):
        """
        Load LibreOffice or use a cached copy if available.
        """
        if os.path.exists(self.libreoffice_install_dir) and os.path.isdir(
                self.libreoffice_install_dir
        ):
            logger.info("Using cached copy of LibreOffice")
        else:
            logger.info(
                "No cached copy of LibreOffice exists, extracting tar stream from Brotli file."
            )
            buffer = BytesIO()
            file_path = "/opt/lo.tar.br"
            with open(file_path, "rb") as brotli_file:
                decompressor = brotli.Decompressor()
                while True:
                    chunk = brotli_file.read(1024)
                    buffer.write(decompressor.process(chunk))
                    if len(chunk) < 1024:
                        break
                buffer.seek(0)

            logger.info(
                "Extracting tar stream to {} for caching".format(
                    self.libreoffice_install_dir
                )
            )
            with tarfile.open(fileobj=buffer) as tar:
                tar.extractall(self.libreoffice_install_dir)
            logger.info("Done caching LibreOffice!")

        self.libreoffice_path = os.path.join(
            self.libreoffice_install_dir, "instdir", "program", "soffice.bin"
        )
        logger.info(f'{self.libreoffice_path = }')

    def convert_docx_to_pdf(self, input_docx_path, output_s3_path):
        """
        Convert a DOCX file to PDF and upload the resulting PDF to an S3 bucket.

        Args:
            input_docx_path (str): The local path to the input DOCX file.
            output_s3_path (str): The S3 bucket path where the PDF should be uploaded.

        Returns:
            tuple: A tuple containing a boolean indicating the success of the conversion, a message string,
                   and the S3 key for the uploaded PDF (if successful). If the conversion fails, the S3 key is None.
        """
        self.load_libreoffice()
        try:
            if os.path.exists(self.libreoffice_path):
                # Set up environment variables for LibreOffice
                font_config_file = os.path.join(
                    self.libreoffice_install_dir,
                    "instdir",
                    "share",
                    "fonts",
                    "truetype",
                    "fc_local.conf",
                )
                font_config_path = os.path.join(
                    self.libreoffice_install_dir,
                    "instdir",
                    "share",
                    "fonts",
                    "truetype",
                )

                env = os.environ.copy()
                env["SAL_USE_VCLPLUGIN"] = "gen"
                env["OOO_FORCE_DESKTOP"] = "headless"
                env["FONTCONFIG_FILE"] = font_config_file
                env["FONTCONFIG_PATH"] = font_config_path

                # Create a temporary directory for output PDF
                os.makedirs(self.output_dir, exist_ok=True)

                # Log the conversion process
                logger.info(f"Converting {input_docx_path} to PDF...")

                command = [
                    self.libreoffice_path,
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    self.output_dir,
                    input_docx_path,
                ]

                # Retry the conversion if it fails the first time
                for _ in range(2):  # Retry twice
                    subprocess.run(command, env=env)
                    # Find the generated PDF file in the output directory
                    pdf_files = [
                        f for f in os.listdir(self.output_dir) if f.endswith(".pdf")
                    ]
                    if pdf_files:
                        # Get the path to the generated PDF file
                        pdf_file_path = os.path.join(self.output_dir, pdf_files[0])

                        # Generate the S3 key for the PDF file
                        pdf_filename = os.path.basename(input_docx_path).replace(
                            ".docx", ".pdf"
                        )
                        output_s3_key = os.path.join(output_s3_path, pdf_filename)

                        logger.info(f'Uploading file to {output_s3_key}')
                        # Upload the PDF file to S3 using the S3Service method
                        S3Service.upload_file_from_path(pdf_file_path, output_s3_key)

                        # Log the successful conversion
                        logger.info(f"Conversion of {input_docx_path} successful")

                        # Return the S3 output path to the user
                        return True, "Conversion successful", output_s3_key

                    else:
                        # Log a retry if no PDF file found
                        logger.info(
                            f"No PDF file found in the output directory for {input_docx_path}, retrying..."
                        )

                # Log the failure after retrying
                logger.error(f"Conversion of {input_docx_path} failed after retrying")
                return False, "Conversion failed after retrying", None

            else:
                # Log the absence of LibreOffice
                logger.error(
                    f"Libreoffice not found in the expected location of {self.libreoffice_path}"
                )
                return False, f"Libreoffice not found in the expected location of {self.libreoffice_path}", None

        except FileNotFoundError as e:
            # Log LibreOffice binary not found error
            logger.error(f"LibreOffice binary not found: {str(e)}")
            return False, f"LibreOffice binary not found: {str(e)}", None
        except subprocess.CalledProcessError as e:
            # Log conversion error
            logger.error(f"Error during conversion: {str(e)}")
            return False, f"Error during conversion: {str(e)}", None
        except Exception as e:
            # Log general error
            logger.error(f"Error: {str(e)}")
            return False, f"Error: {str(e)}", None
        finally:
            # Clean up the temporary directory
            if self.output_dir and os.path.isdir(self.output_dir):
                shutil.rmtree(self.output_dir)

    @staticmethod
    def process_contract_template_to_pdf(
            template_s3_url, output_s3_path, data_dict, file_name):
        """
        Process a contract template by filling in data, converting it to PDF, and uploading it to an S3 bucket.

        Args:
            template_s3_url (str): The S3 URL of the contract template.
            output_s3_path (str): The S3 bucket path where the PDF should be uploaded.
            data_dict (dict): A dictionary containing data to be filled into the template.

        Returns:
            tuple: A tuple containing a boolean indicating the success of the process, a message string,
                   and the S3 key for the uploaded PDF (if successful). If the process fails, the S3 key is None.
        """
        signature_count = {}
        output_path = None
        try:
            # Create a unique temporary directory in /tmp
            temp_dir = "/tmp/doc-tp-pdf"
            os.makedirs(temp_dir, exist_ok=True)

            # Extract the filename from the S3 URL to preserve it
            template_filename = f"{file_name}.docx"
            # Download the template from S3 with the original filename
            local_template_path = os.path.join(temp_dir, template_filename)
            S3Service.download_file_obj_from_s3(template_s3_url, local_template_path)
            # Process the template by placing data
            processed_template_path = os.path.join(
                temp_dir, template_filename
            )
            signature_count = DocumentProcessor.place_data_in_docx(
                local_template_path, processed_template_path, data_dict
            )

            # Convert the processed template to PDF
            converter = DocxToPdfConverter()
            success, message, output_path = converter.convert_docx_to_pdf(
                processed_template_path, output_s3_path
            )

            return success, message, output_path, signature_count

        except Exception as e:
            return False, str(e), output_path, signature_count
        finally:
            # Clean up the temporary directory
            if output_path and os.path.isdir(output_path):
                shutil.rmtree(output_path)


class DocumentProcessor:
    @staticmethod
    def place_data_in_docx(input_file, output_file, data_dict):
        """
        Fill in data in a Docx file using the provided data dictionary and save it to another file.

        Args:
            input_file (str): The path to the input Docx file.
            output_file (str): The path to save the output Docx file with data filled in.
            data_dict (dict): A dictionary containing data to fill into the template.

        Raises:
            Exception: If an error occurs while processing the document.
        """
        try:
            # Count and add signature placeholders to data_dict
            signature_count = DocumentProcessor.count_and_add_signature_placeholders(
                input_file, data_dict
            )
            # Render the document
            doc = DocxTemplate(input_file)
            doc.render(data_dict)
            doc.save(output_file)
            return signature_count
        except Exception as e:
            raise e

    @staticmethod
    def count_and_add_signature_placeholders(input_file, data_dict):
        """
        Count the number of signature placeholders in the input document and add them to the data dictionary.

        Args:
            input_file (str): The path to the input Docx file.
            data_dict (dict): A dictionary to which the signature placeholders will be added.

        Returns:
            dict: A dictionary containing counts of account, customer, and total signatures.

        Raises:
            Exception: If an error occurs while counting signature placeholders.
        """
        try:
            # Extract text from the Word document using docx2txt
            text = docx2txt.process(input_file)
            # Initialize counts for account, customer, and total signatures
            account_signature_count = 0
            customer_signature_count = 0

            # Initialize lists to store signature placeholders and their values
            account_signature_placeholders = []
            customer_signature_placeholders = []

            # Count the number of {{ account_signature_n }} placeholders and store their values
            account_placeholder_pattern = r"{{\s*account_signature_(\d+)\s*}}"

            # Find and store account signatures within the extracted text
            account_matches = re.findall(account_placeholder_pattern, text)
            account_signature_count += len(account_matches)
            account_signature_placeholders.extend(account_matches)

            # Count the number of {{ customer_signature_n }} placeholders and store their values
            customer_placeholder_pattern = r"{{\s*customer_signature_(\d+)\s*}}"

            # Find and store customer signatures within the extracted text
            customer_matches = re.findall(customer_placeholder_pattern, text)
            customer_signature_count += len(customer_matches)
            customer_signature_placeholders.extend(customer_matches)

            # Add account_signature_n keys to data_dict with increasing numbers
            for i, placeholder in enumerate(account_signature_placeholders, start=1):
                signature_key = f"account_signature_{i}"
                data_dict[signature_key] = f"[sig|req|signer{i}]"

            # Add customer_signature_n keys to data_dict with increasing numbers
            for i, placeholder in enumerate(customer_signature_placeholders, start=1):
                signature_key = f"customer_signature_{i}"
                data_dict[
                    signature_key
                ] = f"[sig|req|signer{account_signature_count + i}]"

            # Count total signatures as a sum of account and customer signatures
            total_signature_count = account_signature_count + customer_signature_count

            # Return counts of account, customer, and total signatures in a dictionary
            signature_counts = {
                "account_signature_count": account_signature_count,
                "customer_signature_count": customer_signature_count,
                "total_signature_count": total_signature_count,
            }
            return signature_counts

        except Exception as e:
            raise e
