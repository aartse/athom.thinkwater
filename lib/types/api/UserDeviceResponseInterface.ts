export = UserDeviceResponseInterface;

interface UserDeviceResponseInterface {
    deviceId: number
    deviceName: string
    city: string
    serial: string
    maximumLevel: number
    levelWithSalt: number
    address: string
    latitude: number
    longitude: number
    helpdeskNumber: string
    levelStatus: string
    currentValue: number
    fillPercentage: number
    notificationId: number
    isOnline: boolean
    isOwner: boolean
}