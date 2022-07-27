using System;
using Ultraleap.TouchFree.Library.Configuration;

namespace Ultraleap.TouchFree.Service.ConnectionTypes
{
    public enum ActionCode
    {
        INPUT_ACTION,

        CONFIGURATION_STATE,
        CONFIGURATION_RESPONSE,
        SET_CONFIGURATION_STATE,
        REQUEST_CONFIGURATION_STATE,

        VERSION_HANDSHAKE,
        VERSION_HANDSHAKE_RESPONSE,

        HAND_PRESENCE_EVENT,

        REQUEST_SERVICE_STATUS,
        SERVICE_STATUS_RESPONSE,
        SERVICE_STATUS,

        REQUEST_CONFIGURATION_FILE,
        CONFIGURATION_FILE_STATE,
        SET_CONFIGURATION_FILE,
        CONFIGURATION_FILE_CHANGE_RESPONSE,

        QUICK_SETUP,
        QUICK_SETUP_CONFIG,
        QUICK_SETUP_RESPONSE,

        GET_TRACKING_STATE,
        GET_TRACKING_STATE_RESPONSE,
        SET_TRACKING_STATE,
        SET_TRACKING_STATE_RESPONSE,
    }

    internal enum Compatibility
    {
        COMPATIBLE,
        SERVICE_OUTDATED,
        CLIENT_OUTDATED,
        SERVICE_OUTDATED_WARNING,
        CLIENT_OUTDATED_WARNING
    }

    public enum TrackingServiceState
    {
        UNAVAILABLE,
        NO_CAMERA,
        CONNECTED
    }

    public enum ConfigurationState
    {
        NOT_LOADED,
        LOADED,
        ERRORED
    }

    [Serializable]
    public struct ConfigState
    {
        public string requestID;
        public InteractionConfig interaction;
        public PhysicalConfig physical;

        public ConfigState(string _id, InteractionConfig _interaction, PhysicalConfig _physical)
        {
            requestID = _id;
            interaction = _interaction;
            physical = _physical;
        }
    }

    [Serializable]
    public struct TrackingApiState
    {
        public string requestID;
        public SuccessWrapper<MaskingData?>? mask;
        public SuccessWrapper<bool?>? allowImages;
        public SuccessWrapper<bool?>? cameraReversed;
        public SuccessWrapper<bool?>? analyticsEnabled;
    }

    public struct SuccessWrapper<T>
    {
        public bool succeeded;
        public string msg;
        public T content;

        public SuccessWrapper(bool _success, string _message, T _content)
        {
            succeeded = _success;
            msg = _message;
            content = _content;
        }
    }

    [Serializable]
    public struct ServiceStatus
    {
        public string requestID;
        public TrackingServiceState trackingServiceState;
        public ConfigurationState configurationState;

        public ServiceStatus(string _id, TrackingServiceState _trackingServiceState, ConfigurationState _configurationState)
        {
            requestID = _id;
            trackingServiceState = _trackingServiceState;
            configurationState = _configurationState;
        }
    }

    public struct IncomingRequest
    {
        public ActionCode action;
        public string requestId;
        public string content;

        public IncomingRequest(ActionCode _action, string _requestId, string _content)
        {
            action = _action;
            requestId = _requestId;
            content = _content;
        }
    }

    public struct TrackingResponse
    {
        public bool needsMask;
        public bool needsImages;
        public bool needsOrientation;
        public bool needsAnalytics;

        public string originalRequest;
        public bool isGetRequest;
        public TrackingApiState state;

        public TrackingResponse(string _requestId,
                                string _originalRequest,
                                bool _isGetRequest,
                                bool _needsMask,
                                bool _needsImages,
                                bool _needsOrientation,
                                bool _needsAnalytics)
        {
            originalRequest = _originalRequest;
            isGetRequest = _isGetRequest;
            needsMask = _needsMask;
            needsImages = _needsImages;
            needsOrientation = _needsOrientation;
            needsAnalytics = _needsAnalytics;

            state = new TrackingApiState();
            state.requestID = _requestId;
        }
    }

    [Serializable]
    public struct ResponseToClient
    {
        public string requestID;
        public string status;
        public string message;
        public string originalRequest;

        public ResponseToClient(string _id, string _status, string _msg, string _request)
        {
            requestID = _id;
            status = _status;
            message = _msg;
            originalRequest = _request;
        }
    }

    internal struct CommunicationWrapper<T>
    {
        public string action;
        public T content;

        public CommunicationWrapper(string _actionCode, T _content)
        {
            action = _actionCode;
            content = _content;
        }
    }

    public struct MaskingData
    {
        public float lower;
        public float upper;
        public float right;
        public float left;

        public MaskingData(float _lower, float _upper, float _right, float _left)
        {
            lower = _lower;
            upper = _upper;
            right = _right;
            left = _left;
        }
    }
}