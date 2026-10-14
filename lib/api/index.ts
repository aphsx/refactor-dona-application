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

export {
  linkLineAccount,
  loginByLine,
  loginByNationalId,
  registerFarmer,
  registerFarmerWithLine,
} from "@/lib/api/auth";

export { listNamePrefixes } from "@/lib/api/name-prefixes";

export {
  createLoanApplication,
  getLoanApplication,
  listMyLoanApplications,
  setLoanApplicationDocumentStorage,
  uploadLoanDocument,
} from "@/lib/api/loans";

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
  LoanApplication,
  LoanApplicationCreateInput,
  LoanApplicationDocument,
  NamePrefix,
  PlantingPlan,
  PlantingPlanItem,
  PlantingPlanStatus,
  Plot,
  PlotCard,
  PlotCreateInput,
} from "@/lib/domain";

export {
  LOAN_REQUIRED_DOCUMENT_KIND_IDS,
  PLANTING_PLAN_STATUS_DONE_ID,
  PLANTING_PLAN_STATUS_PENDING_ID,
  farmerDisplayName,
  formatAreaRai,
  formatNationalId,
  formatPhone,
  nationalIdDigits,
  phoneDigits,
  canonicalNationalId,
  formatThaiDate,
  isLoanDocumentRequired,
  loanRequiredDocumentProgress,
} from "@/lib/domain";
