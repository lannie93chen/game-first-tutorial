import {
  _decorator,
  Component,
  EventMouse,
  Input,
  input,
  Node,
  Vec3,
  Animation,
  EventTouch,
} from "cc";
const { ccclass, property } = _decorator;
export const BLOCK_SIZE = 40; // 移動單位

@ccclass("PlayerController")
export class PlayerController extends Component {
  private _startJump: boolean = false; // 是否開始跳躍
  private _jumpStep: number = 0; // 跳躍步數
  private _curJumpTime: number = 0; // 當前跳躍時間
  private _jumpTime: number = 0.1; // 跳躍時間
  private _curJumpSpeed: number = 0; // 移動速度
  private _curPos: Vec3 = new Vec3(); // 當前位置
  private _deltaPos: Vec3 = new Vec3(0, 0, 0); // 位移
  private _targetPos: Vec3 = new Vec3(); // 目標位置
  private _curMoveIndex: number = 0; // 當前是為多少步

  @property(Animation)
  BodyAnim: Animation = null;

  // 觸控範圍
  @property(Node)
  leftTouch: Node = null;
  @property(Node)
  rightTouch: Node = null;
  start() {}
  // 如幀率為 30 每秒時，則每秒會呼叫 update 30 次
  update(deltaTime: number) {
    // 物體移動:P_1 = P_0 + v*t(最終位置 = 目前位置 + 平均速度 * 時間間隔)

    if (this._startJump) {
      this._curJumpTime += deltaTime; // 累積的總跳躍時間
      if (this._curJumpTime > this._jumpTime) {
        // 當跳躍時間是否結束
        // end
        this.node.setPosition(this._targetPos); // 強制到達目標位置
        this._startJump = false;
        this.onOnceJumpEnd();
      } else {
        // tween
        this.node.getPosition(this._curPos);
        this._deltaPos.x = this._curJumpSpeed * deltaTime; // 每一幀根據速度和時間計算位移
        Vec3.add(this._curPos, this._curPos, this._deltaPos);
        this.node.setPosition(this._curPos); // 將位移設定給角色
      }
    }
  }

  setInputActive(active: boolean) {
    // 監聽輸入，滑鼠事件
    if (active) {
      //   input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
      this.leftTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
      this.rightTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    } else {
      //   input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
      this.leftTouch.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
      this.rightTouch.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }
  }

  reset() {
    this._curMoveIndex = 0;
    this.node.getPosition(this._curPos);
    this._targetPos.set(0, 0, 0);
  }

  onMouseUp(event: EventMouse) {
    if (event.getButton() === 0) {
      // 按下左鍵
      this.jumpByStep(1);
    } else if (event.getButton() === 2) {
      // 按下右鍵
      this.jumpByStep(2);
    }
  }
  onTouchStart(event: EventTouch) {
    const target = event.target as Node;
    if (target?.name == "LeftTouch") {
      this.jumpByStep(1);
    } else {
      this.jumpByStep(2);
    }
  }
  jumpByStep(step: number) {
    if (this._startJump) {
      return;
    }
    this._startJump = true;
    this._jumpStep = step; // 跳躍步數為1或2
    this._curJumpTime = 0; // 重置跳躍時間

    const clipName = step == 1 ? "oneStep" : "twoStep";
    const state = this.BodyAnim.getState(clipName); //過取得動畫剪輯的時長
    this._jumpTime = state.duration;

    this._curJumpSpeed = (this._jumpStep * BLOCK_SIZE) / this._jumpTime;
    this.node.getPosition(this._curPos); // 取得當前角色位置
    // Vec3.add 是它提供的靜態方法，用於計算兩個向量相加，並將結果儲存在第一個參數 _targetPos 裡面
    Vec3.add(
      this._targetPos,
      this._curPos,
      new Vec3(this._jumpStep * BLOCK_SIZE, 0, 0)
    ); // 計算出目標位置

    if (this.BodyAnim) {
      this.BodyAnim.play(clipName);
    }

    this._curMoveIndex += step;
  }

  // 監聽跳躍結束
  onOnceJumpEnd() {
    // 派發了一個名為JumpEnd的事件，並將_curMoveIndex作為參數傳遞出去
    this.node.emit("JumpEnd", this._curMoveIndex);
  }
}
