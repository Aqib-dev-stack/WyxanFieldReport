import { isPickerTempCopy } from '@services/files/fileStorage';

// CachesDirectoryPath is '/app/cache' in the Jest stand-in (jest/fsMock.ts).
describe('isPickerTempCopy', () => {
  it("is true only for the picker's copies inside the app's cache", () => {
    expect(
      isPickerTempCopy('file:///app/cache/rn_image_picker_lib_temp_1.jpg'),
    ).toBe(true);
  });

  it('never matches a gallery photo or another file', () => {
    expect(
      isPickerTempCopy(
        'file:///storage/emulated/0/DCIM/rn_image_picker_lib_temp_1.jpg',
      ),
    ).toBe(false);
    expect(isPickerTempCopy('file:///app/cache/other.jpg')).toBe(false);
    expect(isPickerTempCopy('content://media/external/images/1')).toBe(false);
  });
});
