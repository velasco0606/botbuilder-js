import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';

const str = '2018';

const timex = new TimexProperty(str);
console.log(timex);
console.log(<string>timex.month +'/'+<string>timex.dayOfMonth +'/' +<string>timex.year);
console.log(timex.types);