import { Dualsense } from "dualsense-ts";
import { Service } from "typedi";

@Service()
export class ControllerService {
  public controller: Dualsense = new Dualsense();
}
