﻿using System;

namespace Ultraleap.TouchFree.Library.Connections
{
    public enum Compatibility
    {
        COMPATIBLE,
        SERVICE_OUTDATED,
        CLIENT_OUTDATED,
        SERVICE_OUTDATED_WARNING,
        CLIENT_OUTDATED_WARNING
    }

    public readonly record struct CompatibilityInformation(Compatibility Compatibility, Version ClientVersion, Version ServiceVersion);

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
}
