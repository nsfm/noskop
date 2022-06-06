import * as Blessed from "blessed";
import * as Cursed from "blessed-contrib";

export class Interface {
  public readonly screen: Blessed.Widgets.Screen;

  public readonly boost: Cursed.widget.Sparkline;

  constructor() {
    this.screen = Blessed.screen({ smartCSR: true });

    this.boost = Cursed.sparkline({
      label: "Boost",
      tags: false,
      style: { fg: "green" },
    });
    this.screen.append(this.boost);
  }
}
