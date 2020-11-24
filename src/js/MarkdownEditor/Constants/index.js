import EditorEnums from './enums';
import EditorStrings from './strings';
import EditorMeta from './meta';

const Constants = {
  EditorEnums,
  EditorStrings,
  EditorMeta,
  ...EditorEnums,
  ...EditorStrings,
  ...EditorMeta,
};

export default Constants;
