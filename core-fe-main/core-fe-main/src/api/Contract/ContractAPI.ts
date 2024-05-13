import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  CONTRACT: `/api/v1/contract`,
});

const generateContract = async (quoteId: any, contractTemplateId: any): Promise<any> => {
  let url = PATHS.CONTRACT;
  url += `?quote_id=${quoteId}&contract_template_id=${contractTemplateId}`;
  const response = await axiosInstance.post(url);
  return response.data;
};

const sendSignatureRequest = async (contractId: any, data: any): Promise<any> => {
  const response = await axiosInstance.post(
    `${PATHS.CONTRACT}/${contractId}/signature_request`,
    data,
  );
  return response.data;
};

const cancelSignatureRequest = async (contractId: any): Promise<any> => {
  const response = await axiosInstance.post(
    `${PATHS.CONTRACT}/${contractId}/signature_request/cancel`,
  );
  return response.data;
};

const downloadSignedPDF = async (contractId: any): Promise<any> => {
  const response = await axiosInstance.get(
    `${PATHS.CONTRACT}/${contractId}/signature_request/download`,
  );
  return response.data;
};

const getContractPDF = async (contractId: any): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.CONTRACT}/${contractId}`);
  return response.data;
};

const getContractSpecificConfig = async (quoteId: any): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.CONTRACT}/specific_config?quote_id=${quoteId}`);
  return response.data;
};

const saveContractSpecificConfig = async (quoteId: any, data: any): Promise<any> => {
  const response = await axiosInstance.put(
    `${PATHS.CONTRACT}/specific_config?quote_id=${quoteId}`,
    data,
  );
  return response.data;
};

export interface ContractAPIClient {
  readonly generateContract: (quoteId: any, contractTemplateId: any) => Promise<any>;
  readonly sendSignatureRequest: (contractId: any, data: any) => Promise<any>;
  readonly cancelSignatureRequest: (contractId: any) => Promise<any>;
  readonly getContractPDF: (contractId: any) => Promise<any>;
  readonly downloadSignedPDF: (contractId: any) => Promise<any>;
  readonly getContractSpecificConfig: (quoteId: any) => Promise<any>;
  readonly saveContractSpecificConfig: (quoteId: any, data: any) => Promise<any>;
}

const ContractClient: ContractAPIClient = Object.freeze({
  generateContract,
  sendSignatureRequest,
  cancelSignatureRequest,
  getContractPDF,
  downloadSignedPDF,
  getContractSpecificConfig,
  saveContractSpecificConfig,
});

export default ContractClient;
