
import { Modal } from 'ant-design-vue';


/**
 * 将Antd的Modal封装为promise，方便在异步函数中调用。
 */
const ModalAsync = {
  /**
   * 将Antd的Modal.confirm封装为promise，方便在异步函数中调用。
   * @param content 提示内容
   * @param title 提示标题
   */
  confirm: (content: string, title: string) => {
    return new Promise((reslove, reject) => {
      Modal.confirm({
        content,
        onCancel() {
          reject(new Error('canceled'));
        },
        onOk() {
          reslove(true);
        },
        title,
      });
    });
  },
};

export { ModalAsync};
