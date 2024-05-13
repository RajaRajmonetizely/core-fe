/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from '../axiosInstance';

export const PATHS = Object.freeze({
  PRODUCTS: `/api/v1/product`,
});

const getProducts = async (): Promise<any> => {
  const response = await axiosInstance.get(`${PATHS.PRODUCTS}`);
  return response.data;
};

const addProduct = async (product: any): Promise<any> => {
  const response = await axiosInstance.post(`${PATHS.PRODUCTS}`, product);
  return response.data;
};

const editProduct = async (pid: string, product: any): Promise<any> => {
  const response = await axiosInstance.put(`${PATHS.PRODUCTS}/${pid}`, product);
  return response;
};

const deleteProduct = async (pid: string): Promise<any> => {
  const response = await axiosInstance.delete(`${PATHS.PRODUCTS}/${pid}`);
  return response;
};
export interface ProductAPIClient {
  readonly getProducts: () => Promise<any>;
  readonly addProduct: (product: any) => Promise<any>;
  readonly editProduct: (pid: string, product: any) => Promise<any>;
  readonly deleteProduct: (pid: string) => Promise<any>;
}

const ProductClient: ProductAPIClient = Object.freeze({
  getProducts,
  addProduct,
  editProduct,
  deleteProduct,
});

export default ProductClient;
