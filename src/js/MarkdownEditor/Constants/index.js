import EditorEnums from './enums';
import EditorStrings from './strings';

const Constants = {
  EditorEnums,
  EditorStrings,
  ...EditorEnums,
  ...EditorStrings,
};

export default Constants;
