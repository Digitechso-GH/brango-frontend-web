import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pedidosApi } from "../api/pedidos.api";
import { OrderFormData } from "../validaciones/pedidos.schema";
import { handleBackendErrors } from "@/shared/utils/handleBackendErrors";
import { ORDER_STATUS } from "@/shared/constants/order-status";

export const useSavePedidoMutation = (orderId?: string, onClose?: () => void, setError?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OrderFormData) => {
      const isCompany = data.recipientCustomerType === "COMPANY";
      const doc = (data.recipientDocument || "").trim();
      const name = (data.recipientName || "").trim();

      const payload: any = {
        code: data.code,
        waybill: data.waybill || undefined,
        originBranchId: data.originBranchId || undefined,
        recipientCustomerType: isCompany ? "COMPANY" : "INDIVIDUAL",
        companyRuc: isCompany ? doc : undefined,
        companyName: isCompany ? name : undefined,
        recipientDocument: doc,
        recipientName: isCompany ? undefined : name,
        recipientPhone: data.recipientPhone,
        recipientEmail: data.recipientEmail || undefined,
        rawAddress: data.rawAddress,
        formattedAddress: data.formattedAddress || undefined,
        latitude: data.latitude && String(data.latitude).trim() !== "" ? Number(data.latitude) : undefined,
        longitude: data.longitude && String(data.longitude).trim() !== "" ? Number(data.longitude) : undefined,
        driverId: data.driverId || undefined,
        removeDriver: (data as any).removeDriver || undefined,
        warehouseContact: data.warehouseContact || "",
      };

      if (orderId) {
        return pedidosApi.updateOrder(orderId, payload);
      } else {
        return pedidosApi.createOrder(payload);
      }
    },
    onSuccess: (resData: any) => {
      if (onClose) onClose();
      toast.success(orderId ? "Pedido actualizado correctamente" : "Pedido registrado correctamente");

      const savedOrder = resData?.data || resData;

      if (savedOrder && savedOrder.id) {
        queryClient.setQueryData(["orders"], (oldOrders: any) => {
          if (!Array.isArray(oldOrders)) return oldOrders;

          if (orderId) {
            return oldOrders.map((o: any) => (o.id === savedOrder.id ? { ...o, ...savedOrder } : o));
          } else {
            return [savedOrder, ...oldOrders];
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-today"] });
    },
    onError: (err: any) => {
      handleBackendErrors(err, setError, "Error al guardar el pedido");
    },
  });
};

export const useAssignDriverMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderIds, driverId }: { orderIds: string[]; driverId: string }) => {
      return pedidosApi.assignDriverToMultiple(orderIds, driverId);
    },
    onSuccess: () => {
      toast.success("Chofer asignado correctamente a los pedidos seleccionados");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Error al asignar chofer";
      toast.error(msg);
    },
  });
};

export const useStartRouteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      return pedidosApi.updateOrderStatus(orderId, ORDER_STATUS.IN_TRANSIT);
    },
    onSuccess: () => {
      toast.success("Recorrido iniciado correctamente");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Error al iniciar el recorrido";
      toast.error(msg);
    },
  });
};
