/**
 * 车位信息结构体
 */
export interface ParkingSpot {
  id: number;
  name: string;
  picture: string;
  location: string;
  owner: string;
  renter: string;
  rent_end_time: string;
  rent_price: number;
  longitude: number;
  latitude: number;
  create_time: string;
  update_time: string;
}

/**
 * 钱包连接状态
 */
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
}

/**
 * 地图位置
 */
export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * 上传文件
 */
export interface UploadFile {
  uri: string;
  type: string;
  name: string;
}
