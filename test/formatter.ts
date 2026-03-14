import { convert, DateTimeFormatter, LocalDateTime, ZonedDateTime, ZoneId } from '@js-joda/core';

import '@js-joda/timezone';

let formatter = DateTimeFormatter.ofPattern('yyyy:MM:dd HH:mm:ss');

const local = ZonedDateTime.of(
  LocalDateTime.parse('2023:05:27 18:52:01', formatter),
  ZoneId.SYSTEM
);

const utc = convert(local).toDate()
console.log(utc)