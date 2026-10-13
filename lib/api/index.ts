export {
  ApiError,
  apiMessage,
  apiRequest,
  clearSession,
  getAccessToken,
  getSession,
  restoreSession,
  setSession,
} from "@/lib/api/client";

export { loginByPhone, registerFarmer } from "@/lib/api/auth";

export {
  getFarmer,
  getGroup,
  listGroupFarmers,
  setFarmerAvatar,
  updateFarmer,
  uploadFarmerAvatar,
} from "@/lib/api/farmers";

export {
  createPlot,
  getMyPlots,
  getPlot,
  listGroupPlots,
  listMyPlots,
  measurePlotArea,
} from "@/lib/api/plots";

export { getMyPlantingPlan } from "@/lib/api/planting";

export type {
  Farmer,
  FarmerRegisterInput,
  FarmerSession,
  FarmerUpdateInput,
  PlantingPlan,
  PlantingPlanItem,
  PlantingPlanStatus,
  Plot,
  PlotCard,
  PlotCreateInput,
} from "@/lib/domain";

export {
  PLANTING_PLAN_STATUS_DONE_ID,
  PLANTING_PLAN_STATUS_PENDING_ID,
  farmerDisplayName,
  formatAreaRai,
  formatTelInput,
  formatThaiDate,
} from "@/lib/domain";
