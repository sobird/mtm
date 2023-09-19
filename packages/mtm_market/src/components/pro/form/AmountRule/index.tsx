import { WrappedProFormField } from '../index';
import FieldAmountRule from '@/components/pro/field/AmountRule'

export { validator } from '@/components/pro/field/AmountRule'
export default WrappedProFormField(FieldAmountRule, 'AmountRule');
