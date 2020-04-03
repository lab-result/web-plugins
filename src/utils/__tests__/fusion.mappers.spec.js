import * as fusionMappers from '../fusion.mappers';

describe('getAttendingDoctor', () => {
  it('should get the last membership with a doctor role', () => {
    const memberships = [
      { id: '1', roles: ['frontdesk'] },
      { id: '2', roles: ['doctor'] },
      { id: '3', roles: ['lab_head', 'imaging_head'] },
      { id: '4', roles: ['frontdesk', 'billing'] },
      { id: '5', roles: ['doctor_pathologist'] },
      { id: '6', roles: ['admin'] },
    ];
    const attendingDoctor = fusionMappers.getAttendingDoctor(memberships);
    expect(attendingDoctor.id).toBe('5');
  });
});

describe('formatAttendingDoctorName', () => {
  it('should return formatted name of result of getAttendingDoctor', () => {
    const memberships = [
      {
        id: '1',
        name: { firstName: 'John', lastName: 'Doe' },
        roles: ['frontdesk'],
      },
      {
        id: '2',
        name: { firstName: 'Jane', lastName: 'Doe' },
        roles: ['doctor'],
      },
      {
        id: '3',
        name: { firstName: 'John', lastName: 'Smith' },
        roles: ['lab_head', 'imaging_head'],
      },
      {
        id: '4',
        name: { firstName: 'Mary', lastName: 'Sue' },
        roles: ['frontdesk', 'billing'],
      },
      {
        id: '5',
        name: { firstName: 'Gary', lastName: 'Stu' },
        roles: ['doctor_pathologist'],
      },
      {
        id: '6',
        name: { firstName: 'Jane', lastName: 'Smith' },
        roles: ['admin'],
      },
    ];
    const formattedName = fusionMappers.formatAttendingDoctorName(memberships);
    expect(formattedName).toBe('Gary Stu');
  });
});

describe('formatAttendingDoctorPRCNo', () => {
  it('should return PRC license no of result of getAttendingDoctor', () => {
    const memberships = [
      {
        id: '1',
        doc_PRCLicenseNo: '1',
        roles: ['frontdesk'],
      },
      {
        id: '2',
        doc_PRCLicenseNo: '2',
        roles: ['doctor'],
      },
      {
        id: '3',
        doc_PRCLicenseNo: '3',
        roles: ['lab_head', 'imaging_head'],
      },
      {
        id: '4',
        doc_PRCLicenseNo: '4',
        roles: ['frontdesk', 'billing'],
      },
      {
        id: '5',
        doc_PRCLicenseNo: '5',
        roles: ['doctor_pathologist'],
      },
      {
        id: '6',
        doc_PRCLicenseNo: '6',
        roles: ['admin'],
      },
    ];
    const PRCLicenseNo = fusionMappers.formatAttendingDoctorPRCNo(memberships);
    expect(PRCLicenseNo).toBe('5');
  });

  it('should return PTR no of result of getAttendingDoctor', () => {
    const memberships = [
      {
        id: '1',
        doc_PTRNumber: '1',
        roles: ['frontdesk'],
      },
      {
        id: '2',
        doc_PTRNumber: '2',
        roles: ['doctor'],
      },
      {
        id: '3',
        doc_PTRNumber: '3',
        roles: ['lab_head', 'imaging_head'],
      },
      {
        id: '4',
        doc_PTRNumber: '4',
        roles: ['frontdesk', 'billing'],
      },
      {
        id: '5',
        doc_PTRNumber: '5',
        roles: ['doctor_pathologist'],
      },
      {
        id: '6',
        doc_PTRNumber: '6',
        roles: ['admin'],
      },
    ];
    const PTRNumber = fusionMappers.formatAttendingDoctorPTRNo(memberships);
    expect(PTRNumber).toBe('5');
  });
});
