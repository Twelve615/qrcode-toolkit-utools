import type { Option } from '~/logic/CustomOption'

export interface UtoolsData {
  _id: string | number | Record<string, any>
  data: Option
  _rev: string
}
