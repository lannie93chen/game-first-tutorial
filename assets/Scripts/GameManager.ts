/*
填充地圖的流程是這樣的：

1.每次生成時，需要將上次的結果清除
2.第一個地塊永遠是方塊，保證角色不會掉下去
3.由於我們的角色可以選擇跳1個方塊或2個方塊，因此坑最多不應該連續超過2個，也就意味著如果前面1個是坑，那麼接下來的就必須是方塊
*/
import {
  _decorator,
  CCInteger,
  Component,
  instantiate,
  Node,
  Prefab,
} from "cc";
import { BLOCK_SIZE } from "./PlayerController";
const { ccclass, property } = _decorator;

enum BlockType {
  BT_NONE,
  BT_STONE,
}
@ccclass("GameManager")
export class GameManager extends Component {
  @property({ type: Prefab })
  boxPrefab: Prefab | null = null;

  @property({ type: CCInteger })
  public roadLength: number = 50; // 道路長度
  private _road: BlockType[] = [];
  start() {
    this.generateRoad();
  }

  update(deltaTime: number) {}

  generateRoad() {
    console.log("this.generateRoad()");
    // reset
    this.node.removeAllChildren(); // 清除全部的子節點
    this._road = []; // 清空

    // 設置初始位置
    for (let i = 0; i < this.roadLength; i++) {
      // 第一個位置固定加入石塊，其餘位置根據條件加入
      const blockType =
        i === 0 || this._road[i - 1] === BlockType.BT_NONE
          ? BlockType.BT_STONE
          : Math.floor(Math.random() * 2); // 隨機生成0或1
      this._road.push(blockType);

      // 根據生成的類型創建 block
      const block: Node | null = this.spawnBlockByType(blockType);
      if (block) {
        this.node.addChild(block);
        block.setPosition(i * BLOCK_SIZE, 0, 0);
      }
    }
    console.log(" this._road", this._road);
  }
  // 生成方塊
  spawnBlockByType(type: BlockType) {
    if (!this.boxPrefab) {
      return null;
    }

    let block: Node | null = null;
    switch (type) {
      case BlockType.BT_STONE:
        block = instantiate(this.boxPrefab);
        break;
    }

    return block;
  }
}
