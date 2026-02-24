#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WorkoutWidgetBridge, RCTEventEmitter)

RCT_EXTERN_METHOD(writeWorkoutState:(NSString *)jsonString)
RCT_EXTERN_METHOD(clearWorkoutState)
RCT_EXTERN_METHOD(readWidgetActions:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(readPendingVideoImport:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
