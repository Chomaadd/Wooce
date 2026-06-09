declare module "midtrans-client" {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionResult {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: Record<string, any>): Promise<TransactionResult>;
    transaction: {
      notification(body: Record<string, any>): Promise<Record<string, any>>;
      status(orderId: string): Promise<Record<string, any>>;
    };
  }

  class CoreApi {
    constructor(config: SnapConfig);
    transaction: {
      notification(body: Record<string, any>): Promise<Record<string, any>>;
      status(orderId: string): Promise<Record<string, any>>;
    };
  }
}
