import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  TEMPLATE: `/api/v1/document`,
});

const getTemplates = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.TEMPLATE}`);
  return response.data;
};

const getTemplateById = async (templateId: string): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.TEMPLATE}/${templateId}`);
  return response.data;
};

const addTemplate = async (data: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.TEMPLATE}`, data);
  return response.data;
};

const updateTemplate = async (templateId: string, data: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.TEMPLATE}/${templateId}`, data);
  return response.data;
};

const deleteTemplate = async (templateId: string): Promise<any> => {
  const response = await axiosInstance.delete(`${PATHS.TEMPLATE}/${templateId}`);
  return response.data;
};

export interface TemplateAPIClient {
  readonly getTemplates: () => Promise<any>;
  readonly getTemplateById: (templateId: string) => Promise<any>;
  readonly addTemplate: (data: any) => Promise<any>;
  readonly updateTemplate: (templateId: string, data: any) => Promise<any>;
  readonly deleteTemplate: (templateId: string) => Promise<any>;
}

const TemplateClient: TemplateAPIClient = Object.freeze({
  getTemplates,
  getTemplateById,
  addTemplate,
  updateTemplate,
  deleteTemplate,
});

export default TemplateClient;
