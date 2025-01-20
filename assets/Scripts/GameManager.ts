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
  Label,
  Node,
  Prefab,
  Vec3,
} from "cc";
import { BLOCK_SIZE, PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

// 地圖方塊類型
enum BlockType {
  BT_NONE,
  BT_STONE,
}

// 遊戲狀態
enum GameState {
  GS_INIT,
  GS_PLAYING,
  GS_END,
}
@ccclass("GameManager")
export class GameManager extends Component {
  @property({ type: Prefab })
  boxPrefab: Prefab | null = null;

  @property({ type: CCInteger })
  public roadLength: number = 50; // 道路長度
  private _road: BlockType[] = [];

  @property({ type: Node })
  public startMenu: Node | null = null; // 開始的UI
  @property({ type: PlayerController })
  public playerCtrl: PlayerController | null = null; // 角色控制器
  @property({ type: Label })
  public stepsLabel: Label | null = null; // 計步器
  start() {
    this.setCurState(GameState.GS_INIT); // 第一初始化要在start()使用
    // 監聽JumpEnd事件
    // 某個節點派發的事件，只能用這個節點的引用去監聽
    this.playerCtrl?.node.on("JumpEnd", this.onPlayerJumpEnd, this);
  }

  update(deltaTime: number) {}

  generateRoad() {
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

  setCurState(value: GameState) {
    switch (value) {
      case GameState.GS_INIT:
        this.init();
        break;
      case GameState.GS_PLAYING:
        this.playing();
        break;
      case GameState.GS_END:
        break;
    }
  }
  // 遊戲初始
  init() {
    // GS_INIT：狀態下需要初始化地圖、將角色放回初始點、顯示遊戲的UI

    if (this.startMenu) {
      // 顯示開始UI
      this.startMenu.active = true;
    }

    // 產生地圖
    this.generateRoad();

    // 角色控制
    if (this.playerCtrl) {
      this.playerCtrl.setInputActive(false);
      this.playerCtrl.node.setPosition(Vec3.ZERO);
      this.playerCtrl.reset();
    }
  }

  playing() {
    // GS_PLAYING：在狀態下隱藏開始UI、重新設計步器的數值、啟用使用者輸入
    if (this.startMenu) {
      this.startMenu.active = false;
    }

    if (this.stepsLabel) {
      this.stepsLabel.string = "0"; // 步數為0
    }

    setTimeout(() => {
      // 直接設定active會直接開始監聽滑鼠事件，做了延遲處理
      if (this.playerCtrl) {
        this.playerCtrl.setInputActive(true);
      }
    }, 0.1);
  }

  // click:開始按鈕
  onStartButtonClicked() {
    this.setCurState(GameState.GS_PLAYING);
  }

  onPlayerJumpEnd(moveIndex: number) {
    if (this.stepsLabel) {
      this.stepsLabel.string =
        "" + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
    }
    this.checkResult(moveIndex);
  }

  // 判斷結果:角色是否跳躍到坑洞或跳完所有地塊
  checkResult(moveIndex: number) {
    if (moveIndex < this.roadLength) {
      if (this._road[moveIndex] == BlockType.BT_NONE) {
        // 跳到坑

        this.setCurState(GameState.GS_INIT);
      }
    } else {
      // 跳超過了最大長度
      this.setCurState(GameState.GS_INIT);
    }
  }
}
