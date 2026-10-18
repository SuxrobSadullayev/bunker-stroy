export type UserType = 'individual' | 'legal';

export type CompanyStatus = 'active' | 'liquidated' | 'suspended';

export interface CompanyInfo {
  inn: string;
  companyName: string;
  shortName?: string;
  status: CompanyStatus;
  statusDescription: string;
  director?: string;
  address?: string;
  region?: string;
  district?: string;
  registrationDate?: string;
  activityType?: string;
  vatPayer?: boolean;
}

export type UserRole = 
  | 'individual' 
  | 'legal' 
  | 'customer' 
  | 'contractor' 
  | 'logistics_driver' 
  | 'specialist' 
  | 'admin' 
  | 'supplier';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  userType?: UserType;
  companyName?: string;
  inn?: string;
  region?: string;
  district?: string;
  mahalla?: string;
  role: UserRole;
  phone?: string;
  contractNumber?: string;
  mustChangeCredentials?: boolean;
  photoURL?: string;
  createdAt: string;
  status?: 'active' | 'blocked' | 'pending';
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  eimzoVerifiedAt?: string;
  eimzoSerialNumber?: string;
}

export type CabinetVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface SupplierPartner {
  id: string;
  name: string;
  surname?: string;
  companyName: string;
  phone: string;
  email: string;
  login: string;
  password?: string;
  emergencyPassword?: string;
  mustChangeCredentials?: boolean;
  region: string;
  district?: string;
  category: string;
  status: 'active' | 'blocked' | 'pending';
  productsCount: number;
  totalSalesSum: number;
  rating: number;
  contractNumber?: string;
  contractPdfName?: string;
  contractPdfData?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export type LogCategory = 
  | 'add_cabinet' 
  | 'edit_cabinet' 
  | 'delete_cabinet' 
  | 'auth_access' 
  | 'emergency_pass' 
  | 'orders_sales' 
  | 'supplier' 
  | 'auth' 
  | 'cabinet' 
  | 'product' 
  | 'system';

export interface SystemLog {
  id: string;
  action: string;
  actor: string;
  category: LogCategory;
  details: string;
  timestamp: string;
  ip?: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

export interface SupplierSaleItem {
  id: string;
  productTitle: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  totalSum: number;
  buyerName: string;
  buyerPhone: string;
  date: string;
  status: 'delivered' | 'in_transit' | 'pending';
}

export interface SupplierReturnItem {
  id: string;
  productTitle: string;
  quantity: number;
  unit: string;
  totalSum: number;
  reason: string;
  date: string;
  status: 'returned' | 'processed' | 'refunded';
}

export interface SupplierLogisticsRoute {
  id: string;
  fromLocation: string;
  toLocation: string;
  productTitle: string;
  quantityText: string;
  driverName: string;
  driverPhone: string;
  vehicle: string;
  status: 'delivered' | 'in_transit';
  deliveredAt: string;
}

export interface Product {
  id: string;
  title: string;
  category: 'Sement va qorishmalar' | 'Armatura va metall' | 'Gisht va bloklar' | 'Izolyatsiya va tom' | string;
  price: number;
  unit: 'qop (50kg)' | 'tonna' | 'dona' | 'm²' | 'm³' | 'rulon' | 'metr' | string;
  supplierName: string;
  stock: number;
  minOrder: number;
  energyEfficiencyRating?: 'A++' | 'A+' | 'A' | 'B' | 'Standart';
  isEscoCertified?: boolean;
  image: string;
  description: string;
  repairType?: 'ichki' | 'tashqi' | 'ishchi_kuchi' | 'asbob_uskunalar' | 'texnika_ijarasi' | 'universal';
  itemType?: 'material' | 'labor' | 'tool' | 'rental';
  region?: string;
  district?: string;
  salesCount?: number;
  hasDelivery?: boolean;
  warranty?: string;
  hasBonus?: boolean;
  bonusDescription?: string;
  bonusThreshold?: number;
  bonusAmount?: number;
  images?: string[];
  colors?: string[];
  lengths?: string[];
  weights?: string[];
  sizes?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  items: {
    productId: string;
    title: string;
    quantity: number;
    unit: string;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  deliveryRegion?: string;
  deliveryDistrict?: string;
  deliveryStreet?: string;
  deliveryLandmark?: string;
  recipientName?: string;
  recipientPhone?: string;
  paymentMethod?: 'payme' | 'click' | 'uzum' | 'card' | 'cash';
  paymentStatus?: 'paid' | 'pending';
  paidAt?: string;
  transactionId?: string;
  deliveryCoords?: { lat: number; lng: number };
  vehicleType: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsVehicle {
  id: string;
  name: string;
  type: 'samosval' | 'mikser' | 'kran_manipulyator' | 'gazel' | 'fura';
  capacityTons: number;
  pricePerKm: number;
  basePrice: number;
  available: boolean;
  driverName: string;
  phone: string;
  currentLocation: string;
  image: string;
}


export interface MapPlace {
  title: string;
  uri: string;
  placeAnswerSources?: any;
}
